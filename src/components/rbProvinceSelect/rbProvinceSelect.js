ebankingSharedModule.directive('rbProvinceSelect', function(pathService, provincesService) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: pathService.generateTemplatePath('ocb-payments') + '/components/rbProvinceSelect/rbProvinceSelect.html',
        require: '?^rbRecipientLocation',
        scope: {
            province: '=?rbProvince',
            provinceItem: '=?rbProvinceItem',
            placeholder: '@?rbPlaceholder',
            onSelect: '&onSelect'
        },

        link: function postLink($scope, iElement, iAttrs, locationCtrl) {
            $scope.loading = true;
            $scope.provincesList = null;
            $scope.selection = {};
	    
            $scope.loadingPromise = provincesService.list().then(function (provincesList) {
                $scope.provincesList = provincesList;
            });

            $scope.loadingPromise.then(function () {
                $scope.$watch('province', function (provinceCode) {
                    if (!provinceCode) {
                        clearSelection();
                    } else if (!selectProvince(provinceCode)) {
                        setProvince({
                            code: provinceCode,
                            name: provinceCode
                        });
                    }
                });
                $scope.$watch('provinceItem', function (province) {
                   if (!province) {
                       clearSelection();
                   } else if (!selectProvince(province.code)) {
                       setProvince(province);
                   }
                });
                $scope.loading = false;
            });

            $scope.selectProvince = function (province) {
                if (!province) {
                    clearSelection();
                } else {
                    setProvince(province);
                    var provinceCode = province.code;
                    $scope.onSelect({ province: provinceCode });
                }
            };

            function clearSelection() {
                $scope.selection.province = null;
                $scope.provinceItem = null;
                $scope.province = '';
                if (locationCtrl) {
                    locationCtrl.setProvince('');
                }
            }

            function setProvince(province) {
                $scope.selection.province = province;
                $scope.provinceItem = province;
                $scope.province = province.code;
                if (locationCtrl) {
                    locationCtrl.setProvince(province.code);
                }
            }

            function selectProvince(provinceCode) {
                return $scope.provincesList.some(function (province) {
                    if (province.code === provinceCode) {
                        setProvince(province);
                        return true;
                    }
                });
            }
        }
    };
});
