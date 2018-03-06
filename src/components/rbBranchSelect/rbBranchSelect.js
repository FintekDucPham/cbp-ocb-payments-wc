ebankingSharedModule.directive('rbBranchSelect', function(pathService) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: pathService.generateTemplatePath('ocb-payments') + '/components/rbBranchSelect/rbBranchSelect.html',
        require: '^rbRecipientLocation',
        scope: {
            branchCode: '=rbBranchCode',
            branch: '=?rbBranch',
            placeholder: '@?rbPlaceholder',
            onSelect: '&onSelect'
        },

        link: function postLink($scope, iElement, iAttrs, locationCtrl) {
            $scope.loading = true;
            $scope.branchesList = null;
            $scope.selection = {};

            $scope.loadingPromise = locationCtrl.loadingPromise.then(function () {
                $scope.branchesList = locationCtrl.branchesList;
            });

            $scope.loadingPromise.then(function () {
                $scope.$watch('branchCode', function (branchCode) {
                    if (!branchCode) {
                        clearSelection();
                    } else if (!selectBranch(branchCode)) {
                        setBranch({
                            branchCode: branchCode,
                            branchName: branchCode,
                            province: ''
                        });
                    }
                });
                $scope.$watch('branch', function (branch) {
                    if (!branch) {
                        clearSelection();
                    } else if (!selectBranch(branch.branchCode)) {
                        setBranch(branch);
                    }
                });
                $scope.$on('BranchesListUpdated', function () {
                    var selectedBranch = $scope.selection.branch;
                    $scope.branchesList = locationCtrl.branchesList;
                    if (selectedBranch && !selectBranch(selectedBranch.branchCode)) {
                        clearSelection();
                    }
                });
                $scope.loading = false;
            });

            $scope.selectBranch = function (branch) {
                if (!branch) {
                    clearSelection();
                } else {
                    setBranch(branch);
                    var branchCode = branch.branchCode;
                    $scope.onSelect({ branchCode: branchCode });
                }
            };

            function clearSelection() {
                $scope.selection.branch = null;
                $scope.branch = null;
                $scope.branchCode = '';
            }

            function setBranch(branch) {
                $scope.selection.branch = branch;
                $scope.branch = branch;
                $scope.branchCode = branch.branchCode;
            }

            function selectBranch(branchCode) {
                return $scope.branchesList.some(function (branch) {
                    if (branch.branchCode === branchCode) {
                        setBranch(branch);
                        return true;
                    }
                });
            }
        }
    };
});
